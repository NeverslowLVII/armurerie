import type { Role } from '@prisma/client';
import axiosInstance from 'axios';

// Re-export the Role enum
export { Role } from '@prisma/client';

// Get the base URL dynamically
const getBaseUrl = () => {
  if (typeof globalThis !== 'undefined') {
    // Browser should use relative path
    return '/api';
  }
  if (process.env.VERCEL_URL) {
    // Reference for vercel.com
    return `https://${process.env.VERCEL_URL}/api`;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    // Custom API URL
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Fallback for local development
  return 'http://localhost:3000/api';
};

const baseURL = getBaseUrl();
axiosInstance.defaults.baseURL = baseURL;

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  color: string | null;
  role: Role;
  contractUrl?: string;
  commission?: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Weapon {
  id: number;
  horodateur: string;
  user_id: number;
  detenteur: string;
  bp?: string;
  nom_arme: string;
  serigraphie: string;
  prix: number;
  cout_production: number;
  user: User;
  base_weapon?: BaseWeapon;
}

interface WeaponCreate {
  horodateur: string;
  user_id: number;
  detenteur: string;
  bp?: string;
  nom_arme: string;
  serigraphie: string;
  prix: number;
  cout_production: number;
}

export interface BaseWeapon {
  id: number;
  nom: string;
  prix_defaut: number;
  cout_production_defaut: number;
}

interface BaseWeaponCreate {
  nom: string;
  prix_defaut: number;
  cout_production_defaut: number;
}

// User endpoints
export const getUsers = async (): Promise<User[]> => {
  const response = await axiosInstance.get('/employees');
  return response.data;
};

// Weapon endpoints
export const getWeapons = async (): Promise<Weapon[]> => {
  const response = await axiosInstance.get('/weapons');
  return response.data;
};

export const createWeapon = async (weapon: WeaponCreate): Promise<Weapon> => {
  try {
    const response = await axiosInstance.post('/weapons', weapon);

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Failed to create weapon: ${response.statusText}`);
    }

    return response.data;
  } catch (error: unknown) {
    if (axiosInstance.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error("Données invalides pour la création de l'arme");
      }
      if (process.env.NODE_ENV !== 'test') {
        console.error('Create weapon error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
      }
      throw new Error(`Erreur lors de la création: ${error.message}`);
    }
    throw error;
  }
};

export const updateWeapon = async (
  id: number,
  weapon: WeaponCreate
): Promise<Weapon> => {
  const response = await axiosInstance.put(`/weapons/${id}`, weapon);
  return response.data;
};

// Base Weapons
export const getBaseWeapons = async (): Promise<BaseWeapon[]> => {
  const response = await axiosInstance.get('/base-weapons');
  return response.data;
};

export const createBaseWeapon = async (
  baseWeapon: BaseWeaponCreate
): Promise<BaseWeapon> => {
  const response = await axiosInstance.post('/base-weapons', baseWeapon);
  return response.data;
};

export const updateBaseWeapon = async (
  id: number,
  baseWeapon: BaseWeaponCreate
): Promise<BaseWeapon> => {
  const response = await axiosInstance.put(`/base-weapons/${id}`, baseWeapon);
  return response.data;
};
