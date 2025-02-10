import axios from 'axios';

// Configuration globale d'axios
const baseURL = process.env.NODE_ENV === 'test' ? 'http://localhost:3000/api' : (process.env.API_BASE_URL || 'http://localhost:3000/api');
axios.defaults.baseURL = baseURL;
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
axios.defaults.headers.common['Access-Control-Allow-Headers'] = '*';

export enum Role {
  EMPLOYEE = "EMPLOYEE",
  CO_PATRON = "CO_PATRON",
  PATRON = "PATRON"
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
  cout_production: number;
  employee: Employee;
}

export interface WeaponCreate {
  horodateur: string;
  employe_id: number;
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

// Employee endpoints
export const getEmployees = async (): Promise<Employee[]> => {
  const response = await axios.get('/employees');
  return response.data;
};

export const getEmployee = async (id: number): Promise<Employee> => {
  const response = await axios.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (employee: EmployeeCreate): Promise<Employee> => {
  const response = await axios.post('/employees', employee);
  return response.data;
};

export const updateEmployee = async (id: number, employee: EmployeeCreate): Promise<Employee> => {
  const response = await axios.put(`/employees/${id}`, employee);
  return response.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  await axios.delete(`/employees/${id}`);
};

export const mergeEmployees = async (employeeIds: number[], targetId: number): Promise<Employee> => {
  const response = await axios.post('/employees/merge', {
    employee_ids: employeeIds,
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

export const getEmployeeWeapons = async (employeeId: number): Promise<Weapon[]> => {
  const response = await axios.get(`/employees/${employeeId}/weapons`);
  return response.data;
};

export const reassignWeapons = async (fromEmployeeId: number, toEmployeeId: number): Promise<string> => {
  const response = await axios.post('/employees/reassign-weapons', null, {
    params: {
      from_employee_id: fromEmployeeId,
      to_employee_id: toEmployeeId
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

export default axios; 