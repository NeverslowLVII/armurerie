'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getWeapons, getUsers, getBaseWeapons, Weapon, User, BaseWeapon } from '../services/api';
import { useSession } from 'next-auth/react';
import { LoadingOverlay } from '@/components/ui/loading';

interface DataContextType {
  weapons: Weapon[];
  users: User[];
  baseWeapons: BaseWeapon[];
  loading: boolean;
  error: string | null;
  refreshWeapons: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshBaseWeapons: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [baseWeapons, setBaseWeapons] = useState<BaseWeapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWeapons = useCallback(async () => {
    try {
      const data = await getWeapons();
      setWeapons(data);
    } catch (error) {
      console.error('Error fetching weapons:', error);
      setError('Error fetching weapons');
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

  const refreshBaseWeapons = useCallback(async () => {
    try {
      const data = await getBaseWeapons();
      setBaseWeapons(data);
    } catch (error) {
      console.error('Error fetching base weapons:', error);
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
    try {
      await Promise.all([
        refreshWeapons(),
        refreshUsers(),
        refreshBaseWeapons()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Error refreshing data');
    } finally {
      setLoading(false);
    }
  }, [refreshWeapons, refreshUsers, refreshBaseWeapons, status]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll, status]);

  return (
    <DataContext.Provider value={{
      weapons,
      users,
      baseWeapons,
      loading,
      error,
      refreshWeapons,
      refreshUsers,
      refreshBaseWeapons,
      refreshAll
    }}>
      <LoadingOverlay loading={loading} text="Chargement des données...">
        {children}
      </LoadingOverlay>
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
} 