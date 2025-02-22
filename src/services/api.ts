import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
axios.defaults.baseURL = baseURL;

// Import the Role enum directly from Prisma
import { Role } from '@prisma/client';
export { Role };

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  color: string | null;
  role: Role;
  contractUrl?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  username?: string;
  color?: string;
  role?: Role;
  contractUrl?: string;
}

export interface Weapon {
  id: number;
  horodateur: string;
  user_id: number;
  detenteur: string;
  nom_arme: string;
  serigraphie: string;
  prix: number;
  cout_production: number;
  user: User;
  base_weapon?: BaseWeapon;
}

export interface WeaponCreate {
  horodateur: string;
  user_id: number;
  detenteur: string;
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

export interface BaseWeaponCreate {
  nom: string;
  prix_defaut: number;
  cout_production_defaut: number;
}

// User endpoints
export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get('/employees');
  return response.data;
};

export const getUser = async (id: number): Promise<User> => {
  const response = await axios.get(`/employees/${id}`);
  return response.data;
};

export const createUser = async (user: UserCreate): Promise<User> => {
  const response = await axios.post('/employees', user);
  return response.data;
};

export const updateUser = async (id: number, user: UserCreate): Promise<User> => {
  const response = await axios.put(`/employees/${id}`, user);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await axios.delete(`/employees/${id}`);
};

export const mergeUsers = async (userIds: number[], targetId: number): Promise<User> => {
  const response = await axios.post('/employees/merge', {
    user_ids: userIds,
    target_id: targetId
  });
  return response.data;
};

// Weapon endpoints
export const getWeapons = async (): Promise<Weapon[]> => {
  const response = await axios.get('/weapons');
  return response.data;
};

export const getWeapon = async (id: number): Promise<Weapon> => {
  const response = await axios.get(`/weapons/${id}`);
  return response.data;
};

export const createWeapon = async (weapon: WeaponCreate): Promise<Weapon> => {
  try {
    const response = await axios.post('/weapons', weapon);
    
    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Failed to create weapon: ${response.statusText}`);
    }
    
    return response.data;
  } catch (error) {
    const axiosError = error as any;
    if (axiosError?.isAxiosError === true) {
      if (axiosError.response?.status === 400) {
        return Promise.reject(new Error('Données invalides pour la création de l\'arme'));
      }
      if (process.env.NODE_ENV !== 'test') {
        console.error('Create weapon error:', { status: axiosError.response?.status, statusText: axiosError.response?.statusText });
      }
      return Promise.reject(new Error(`Erreur lors de la création: ${axiosError.message}`));
    }
    return Promise.reject(error);
  }
};

export const updateWeapon = async (id: number, weapon: WeaponCreate): Promise<Weapon> => {
  const response = await axios.put(`/weapons/${id}`, weapon);
  return response.data;
};

export const deleteWeapon = async (id: number): Promise<void> => {
  try {
    const response = await axios.delete(`/weapons/${id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status !== 204 && response.status !== 200) {
      throw new Error(`Failed to delete weapon: ${response.statusText}`);
    }
  } catch (error) {
    const axiosErrorDel = error as any;
    if (axiosErrorDel?.isAxiosError === true) {
      if (axiosErrorDel.response?.status === 404) {
        return Promise.reject(new Error(`L'arme avec l'ID ${id} n'a pas été trouvée`));
      } else if (axiosErrorDel.response?.status === 405) {
        console.error('Delete request failed:', axiosErrorDel.response);
        return Promise.reject(new Error('La méthode de suppression n\'est pas autorisée'));
      }
      return Promise.reject(new Error(`Erreur lors de la suppression: ${axiosErrorDel.message}`));
    }
    return Promise.reject(error);
  }
};

export const getUserWeapons = async (userId: number): Promise<Weapon[]> => {
  const response = await axios.get(`/employees/${userId}/weapons`);
  return response.data;
};

export const reassignWeapons = async (fromUserId: number, toUserId: number): Promise<string> => {
  const response = await axios.post('/employees/reassign-weapons', null, {
    params: {
      from_user_id: fromUserId,
      to_user_id: toUserId
    }
  });
  return response.data.message;
};

// Base Weapons
export const getBaseWeapons = async (): Promise<BaseWeapon[]> => {
  const response = await axios.get('/base-weapons');
  return response.data;
};

export const getBaseWeapon = async (id: number): Promise<BaseWeapon> => {
  const response = await axios.get(`/base-weapons/${id}`);
  return response.data;
};

export const createBaseWeapon = async (baseWeapon: BaseWeaponCreate): Promise<BaseWeapon> => {
  const response = await axios.post('/base-weapons', baseWeapon);
  return response.data;
};

export const updateBaseWeapon = async (id: number, baseWeapon: BaseWeaponCreate): Promise<BaseWeapon> => {
  const response = await axios.put(`/base-weapons/${id}`, baseWeapon);
  return response.data;
};

export const deleteBaseWeapon = async (id: number): Promise<void> => {
  try {
    const response = await axios.delete(`/base-weapons/${id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status !== 204 && response.status !== 200) {
      throw new Error(`Failed to delete base weapon: ${response.statusText}`);
    }
  } catch (error) {
    const axiosErrorBase = error as any;
    if (axiosErrorBase?.isAxiosError === true) {
      if (axiosErrorBase.response?.status === 404) {
        return Promise.reject(new Error(`L'arme de base avec l'ID ${id} n'a pas été trouvée`));
      } else if (axiosErrorBase.response?.status === 405) {
        console.error('Delete request failed:', axiosErrorBase.response);
        return Promise.reject(new Error('La méthode de suppression n\'est pas autorisée'));
      }
      return Promise.reject(new Error(`Erreur lors de la suppression: ${axiosErrorBase.message}`));
    }
    return Promise.reject(error);
  }
};

// For backward compatibility
export type Employee = User;
export type EmployeeCreate = UserCreate;
export const getEmployees = getUsers;
export const getEmployee = getUser;
export const createEmployee = createUser;
export const updateEmployee = updateUser;
export const deleteEmployee = deleteUser;
export const mergeEmployees = mergeUsers;
export const getEmployeeWeapons = getUserWeapons;

export default axios; 