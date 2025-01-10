import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Configuration globale d'axios
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
axios.defaults.headers.common['Access-Control-Allow-Headers'] = '*';

// Intercepteur pour les requêtes
axios.interceptors.request.use(function (config) {
  // Ajout des headers CORS pour chaque requête
  config.headers['Access-Control-Allow-Origin'] = 'https://armurie-frontend.vercel.app';
  return config;
}, function (error) {
  return Promise.reject(error);
});

export enum Role {
  EMPLOYEE = "employee",
  PATRON = "patron"
}

export interface Employee {
  id: number;
  name: string;
  color: string | null;
  role: Role;
}

export interface EmployeeCreate {
  name: string;
  color?: string;
  role?: Role;
}

export interface Weapon {
  id: number;
  horodateur: string;
  employe_id: number;
  detenteur: string;
  nom_arme: string;
  serigraphie: string;
  prix: number;
  employee: Employee;
}

export interface WeaponCreate {
  horodateur: string;
  employe_id: number;
  detenteur: string;
  nom_arme: string;
  serigraphie: string;
  prix: number;
}

export interface BaseWeapon {
    id: number;
    nom: string;
    prix_defaut: number;
}

export interface BaseWeaponCreate {
    nom: string;
    prix_defaut: number;
}

// Employee endpoints
export const getEmployees = async (): Promise<Employee[]> => {
  const response = await axios.get(`${API_URL}/employees/`);
  return response.data;
};

export const getEmployee = async (id: number): Promise<Employee> => {
  const response = await axios.get(`${API_URL}/employees/${id}`);
  return response.data;
};

export const createEmployee = async (employee: EmployeeCreate): Promise<Employee> => {
  const response = await axios.post(`${API_URL}/employees/`, employee);
  return response.data;
};

export const updateEmployee = async (id: number, employee: EmployeeCreate): Promise<Employee> => {
  const response = await axios.put(`${API_URL}/employees/${id}`, employee);
  return response.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/employees/${id}`);
};

export const mergeEmployees = async (employeeIds: number[], targetId: number): Promise<Employee> => {
  const response = await axios.post(`${API_URL}/employees/merge`, {
    employee_ids: employeeIds,
    target_id: targetId
  });
  return response.data;
};

// Weapon endpoints
export const getWeapons = async (): Promise<Weapon[]> => {
  const response = await axios.get(`${API_URL}/weapons/`);
  return response.data;
};

export const getWeapon = async (id: number): Promise<Weapon> => {
  const response = await axios.get(`${API_URL}/weapons/${id}`);
  return response.data;
};

export const createWeapon = async (weapon: WeaponCreate): Promise<Weapon> => {
  const response = await axios.post(`${API_URL}/weapons/`, weapon);
  return response.data;
};

export const updateWeapon = async (id: number, weapon: WeaponCreate): Promise<Weapon> => {
  const response = await axios.put(`${API_URL}/weapons/${id}`, weapon);
  return response.data;
};

export const deleteWeapon = async (id: number): Promise<void> => {
  try {
    const response = await axios.delete(`${API_URL}/weapons/${id}`);
    if (response.status !== 200) {
      throw new Error(`Failed to delete weapon: ${response.statusText}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`L'arme avec l'ID ${id} n'a pas été trouvée`);
    }
    throw error;
  }
};

export const getEmployeeWeapons = async (employeeId: number): Promise<Weapon[]> => {
  const response = await axios.get(`${API_URL}/employees/${employeeId}/weapons`);
  return response.data;
};

export const reassignWeapons = async (fromEmployeeId: number, toEmployeeId: number): Promise<string> => {
  const response = await axios.post(`${API_URL}/employees/reassign-weapons`, null, {
    params: {
      from_employee_id: fromEmployeeId,
      to_employee_id: toEmployeeId
    }
  });
  return response.data.message;
};

// Base Weapons
export const getBaseWeapons = async (): Promise<BaseWeapon[]> => {
    const response = await axios.get(`${API_URL}/base-weapons/`);
    return response.data;
};

export const getBaseWeapon = async (id: number): Promise<BaseWeapon> => {
    const response = await axios.get(`${API_URL}/base-weapons/${id}`);
    return response.data;
};

export const createBaseWeapon = async (baseWeapon: BaseWeaponCreate): Promise<BaseWeapon> => {
    const response = await axios.post(`${API_URL}/base-weapons/`, baseWeapon);
    return response.data;
};

export const updateBaseWeapon = async (id: number, baseWeapon: BaseWeaponCreate): Promise<BaseWeapon> => {
    const response = await axios.put(`${API_URL}/base-weapons/${id}`, baseWeapon);
    return response.data;
};

export const deleteBaseWeapon = async (id: number): Promise<BaseWeapon> => {
    const response = await axios.delete(`${API_URL}/base-weapons/${id}`);
    return response.data;
};

export default axios; 