'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getWeapons, getEmployees, getBaseWeapons, Weapon, Employee, BaseWeapon } from '../services/api';

interface DataContextType {
  weapons: Weapon[];
  employees: Employee[];
  baseWeapons: BaseWeapon[];
  loading: boolean;
  error: string | null;
  refreshWeapons: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  refreshBaseWeapons: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [baseWeapons, setBaseWeapons] = useState<BaseWeapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWeapons = async () => {
    try {
      const data = await getWeapons();
      setWeapons(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des armes');
      console.error('Error fetching weapons:', err);
    }
  };

  const refreshEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des employés');
      console.error('Error fetching employees:', err);
    }
  };

  const refreshBaseWeapons = async () => {
    try {
      const data = await getBaseWeapons();
      setBaseWeapons(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des armes de base');
      console.error('Error fetching base weapons:', err);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshWeapons(),
        refreshEmployees(),
        refreshBaseWeapons()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  return (
    <DataContext.Provider value={{
      weapons,
      employees,
      baseWeapons,
      loading,
      error,
      refreshWeapons,
      refreshEmployees,
      refreshBaseWeapons,
      refreshAll
    }}>
      {children}
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