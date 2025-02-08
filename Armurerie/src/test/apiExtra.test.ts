import axios from 'axios';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  mergeEmployees,
  getWeapons,
  getWeapon,
  createWeapon,
  updateWeapon,
  deleteWeapon,
  getEmployeeWeapons,
  reassignWeapons,
  getBaseWeapons,
  getBaseWeapon,
  createBaseWeapon,
  updateBaseWeapon,
  deleteBaseWeapon,
  Role
} from '../services/api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Axios configuration', () => {
  let mockAxios: any;

  beforeEach(() => {
    jest.resetModules();
    mockAxios = {
      defaults: {
        baseURL: '',
        headers: {
          common: {}
        }
      }
    };
    jest.mock('axios', () => mockAxios);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('configures axios with correct baseURL and headers', () => {
    require('../services/api');
    
    expect(mockAxios.defaults.baseURL).toBe('http://localhost:3000/api');
    expect(mockAxios.defaults.headers.common['Access-Control-Allow-Origin']).toBe('*');
    expect(mockAxios.defaults.headers.common['Access-Control-Allow-Methods']).toBe('GET,PUT,POST,DELETE,OPTIONS');
    expect(mockAxios.defaults.headers.common['Access-Control-Allow-Headers']).toBe('*');
  });
});

describe('Employee endpoints', () => {
  it('getEmployees returns employees data', async () => {
    const fakeData = [{ id: 1, name: 'John', color: 'red', role: Role.EMPLOYEE }];
    mockedAxios.get.mockResolvedValueOnce({ data: fakeData });
    const result = await getEmployees();
    expect(result).toEqual(fakeData);
    expect(mockedAxios.get).toHaveBeenCalledWith('/employees');
  });

  it('getEmployee returns employee data', async () => {
    const fakeData = { id: 1, name: 'John', color: 'red', role: Role.EMPLOYEE };
    mockedAxios.get.mockResolvedValueOnce({ data: fakeData });
    const result = await getEmployee(1);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.get).toHaveBeenCalledWith('/employees/1');
  });

  it('createEmployee returns created employee', async () => {
    const input = { name: 'Jane', color: 'blue', role: Role.EMPLOYEE };
    const fakeData = { id: 2, ...input };
    mockedAxios.post.mockResolvedValueOnce({ data: fakeData });
    const result = await createEmployee(input);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.post).toHaveBeenCalledWith('/employees', input);
  });

  it('updateEmployee returns updated employee', async () => {
    const input = { name: 'Jane', color: 'green', role: Role.EMPLOYEE };
    const fakeData = { id: 2, ...input };
    mockedAxios.put.mockResolvedValueOnce({ data: fakeData });
    const result = await updateEmployee(2, input);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.put).toHaveBeenCalledWith('/employees/2', input);
  });

  it('deleteEmployee completes successfully', async () => {
    mockedAxios.delete.mockResolvedValueOnce({});
    await expect(deleteEmployee(3)).resolves.toBeUndefined();
    expect(mockedAxios.delete).toHaveBeenCalledWith('/employees/3');
  });

  it('mergeEmployees returns merged employee', async () => {
    const ids = [1, 2];
    const targetId = 3;
    const fakeData = { id: targetId, name: 'Merged', color: 'purple', role: Role.EMPLOYEE };
    mockedAxios.post.mockResolvedValueOnce({ data: fakeData });
    const result = await mergeEmployees(ids, targetId);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.post).toHaveBeenCalledWith('/employees/merge', { employee_ids: ids, target_id: targetId });
  });
});

describe('Weapon endpoints', () => {
  it('getWeapons returns weapons data', async () => {
    const fakeData = [{
      id: 1,
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50,
      employee: { id: 1, name: 'John', color: null, role: Role.EMPLOYEE}
    }];
    mockedAxios.get.mockResolvedValueOnce({ data: fakeData });
    const result = await getWeapons();
    expect(result).toEqual(fakeData);
    expect(mockedAxios.get).toHaveBeenCalledWith('/weapons');
  });

  it('getWeapon returns weapon data', async () => {
    const fakeData = {
      id: 1,
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50,
      employee: { id: 1, name: 'John', color: null, role: Role.EMPLOYEE}
    };
    mockedAxios.get.mockResolvedValueOnce({ data: fakeData });
    const result = await getWeapon(1);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.get).toHaveBeenCalledWith('/weapons/1');
  });

  it('createWeapon returns weapon data when response is successful (status 201)', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    const fakeData = { id: 1, ...weaponInput, employee: { id: 1, name: 'John', color: null, role: Role.EMPLOYEE} };
    mockedAxios.post.mockResolvedValueOnce({ status: 201, data: fakeData });
    const result = await createWeapon(weaponInput);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.post).toHaveBeenCalledWith('/weapons', weaponInput);
  });

  it('createWeapon returns weapon data when response is successful (status 200)', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    const fakeData = { id: 1, ...weaponInput, employee: { id: 1, name: 'John', color: null, role: Role.EMPLOYEE } };
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: fakeData });
    const result = await createWeapon(weaponInput);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.post).toHaveBeenCalledWith('/weapons', weaponInput);
  });

  it('createWeapon rejects with invalid data error when response status is 400', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Invalid Weapon',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    const error = {
      isAxiosError: true,
      response: { status: 400, statusText: 'Bad Request' },
      message: 'Bad Request'
    };
    mockedAxios.post.mockRejectedValueOnce(error);
    await expect(createWeapon(weaponInput)).rejects.toThrow("Données invalides pour la création de l'arme");
  });

  it('createWeapon throws generic error for non-400 error', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    const error = {
      isAxiosError: true,
      response: { status: 500, statusText: 'Internal Server Error' },
      message: 'Network Error'
    };
    mockedAxios.post.mockRejectedValueOnce(error);
    await expect(createWeapon(weaponInput)).rejects.toThrow('Erreur lors de la création: Network Error');
  });

  it('updateWeapon returns updated weapon data', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 150,
      cout_production: 75
    };
    const fakeData = { id: 1, ...weaponInput, employee: { id: 1, name: 'John', color: null, role: Role.EMPLOYEE} };
    mockedAxios.put.mockResolvedValueOnce({ data: fakeData });
    const result = await updateWeapon(1, weaponInput);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.put).toHaveBeenCalledWith('/weapons/1', weaponInput);
  });

  it('deleteWeapon completes successfully when status is 204', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ status: 204 });
    await expect(deleteWeapon(1)).resolves.toBeUndefined();
    expect(mockedAxios.delete).toHaveBeenCalledWith('/weapons/1', { headers: { 'Content-Type': 'application/json' } });
  });

  it('deleteWeapon completes successfully when status is 200', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ status: 200 });
    await expect(deleteWeapon(1)).resolves.toBeUndefined();
    expect(mockedAxios.delete).toHaveBeenCalledWith('/weapons/1', { headers: { 'Content-Type': 'application/json' } });
  });

  it('deleteWeapon throws error for non-successful status', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ status: 500, statusText: 'Error' });
    await expect(deleteWeapon(1)).rejects.toThrow('Failed to delete weapon: Error');
  });

  it('deleteWeapon rejects with not found error when status is 404', async () => {
    const error = {
      isAxiosError: true,
      response: { status: 404, statusText: 'Not Found' },
      message: 'Not Found'
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteWeapon(1)).rejects.toThrow("L'arme avec l'ID 1 n'a pas été trouvée");
  });

  it('deleteWeapon rejects with method not allowed error for 405 error', async () => {
    const error = {
      isAxiosError: true,
      response: { status: 405, statusText: 'Method Not Allowed' },
      message: 'Method Not Allowed'
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteWeapon(1)).rejects.toThrow("La méthode de suppression n'est pas autorisée");
  });

  it('deleteWeapon throws generic error for axios error with status other than 404 and 405', async () => {
    const error = {
      isAxiosError: true,
      response: { status: 500, statusText: 'Server Error' },
      message: 'Generic Error'
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteWeapon(1)).rejects.toThrow('Erreur lors de la suppression: Generic Error');
  });

  it('deleteWeapon throws error when resolved response status is not 200 or 204', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ status: 202, statusText: 'Accepted' });
    await expect(deleteWeapon(1)).rejects.toThrow('Failed to delete weapon: Accepted');
  });

  it('getEmployeeWeapons returns weapons for a given employee', async () => {
    const fakeData = [{
      id: 1,
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50,
      employee: { id: 1, name: 'John', color: null, role: Role.EMPLOYEE}
    }];
    mockedAxios.get.mockResolvedValueOnce({ data: fakeData });
    const result = await getEmployeeWeapons(1);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.get).toHaveBeenCalledWith('/employees/1/weapons');
  });

  it('reassignWeapons returns confirmation message', async () => {
    const message = 'Weapons reassigned successfully';
    mockedAxios.post.mockResolvedValueOnce({ data: { message } });
    const result = await reassignWeapons(1, 2);
    expect(result).toEqual(message);
    expect(mockedAxios.post).toHaveBeenCalledWith('/employees/reassign-weapons', null, { params: { from_employee_id: 1, to_employee_id: 2 } });
  });

  it('createWeapon rejects when response status is not 200 or 201', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Invalid Weapon',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    mockedAxios.post.mockResolvedValueOnce({ status: 500, statusText: 'Server Error', data: {} });
    await expect(createWeapon(weaponInput)).rejects.toThrow('Failed to create weapon: Server Error');
  });

  it('createWeapon rejects with non-Axios error', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    mockedAxios.post.mockRejectedValueOnce(new Error('Plain error'));
    await expect(createWeapon(weaponInput)).rejects.toThrow('Plain error');
  });

  it('deleteWeapon rejects with non-Axios error', async () => {
    mockedAxios.delete.mockRejectedValueOnce(new Error('Plain error for weapon'));
    await expect(deleteWeapon(1)).rejects.toThrow('Plain error for weapon');
  });

  it('createWeapon logs error when NODE_ENV is not test (isolateModules)', async () => {
    await jest.isolateModules(async () => {
      (process as any).env.NODE_ENV = 'development';
      jest.resetModules();
      jest.doMock('axios', () => ({
        __esModule: true,
        default: {
          get: jest.fn(),
          post: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
          defaults: { baseURL: '', headers: { common: {} } }
        }
      }));
      const axiosMock = require('axios').default;
      const { createWeapon } = await import('../services/api');
      const weaponInput = {
        horodateur: '2021-01-01T00:00:00Z',
        employe_id: 1,
        detenteur: 'user',
        nom_arme: 'Test Weapon',
        serigraphie: 'none',
        prix: 100,
        cout_production: 50
      };
      const error = {
        isAxiosError: true,
        response: { status: 500, statusText: 'Internal Error' },
        message: 'Network Error'
      };
      axiosMock.post.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(createWeapon(weaponInput)).rejects.toThrow('Erreur lors de la création: Network Error');
      expect(consoleSpy).toHaveBeenCalledWith('Create weapon error:', { status: 500, statusText: 'Internal Error' });
      consoleSpy.mockRestore();
    });
  });

  it('createWeapon handles error without response object', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    const error = {
      isAxiosError: true,
      message: 'Network Error'
    };
    mockedAxios.post.mockRejectedValueOnce(error);
    await expect(createWeapon(weaponInput)).rejects.toThrow('Erreur lors de la création: Network Error');
  });

  it('deleteWeapon handles error without response object', async () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error'
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteWeapon(1)).rejects.toThrow('Erreur lors de la suppression: Network Error');
  });

  it('createWeapon handles error with undefined response', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    const error = {
      isAxiosError: true,
      message: 'Network Error',
      response: undefined
    };
    mockedAxios.post.mockRejectedValueOnce(error);
    await expect(createWeapon(weaponInput)).rejects.toThrow('Erreur lors de la création: Network Error');
  });

  it('deleteWeapon handles error with undefined response', async () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
      response: undefined
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteWeapon(1)).rejects.toThrow('Erreur lors de la suppression: Network Error');
  });

  it('createWeapon handles error with null response', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    const error = {
      isAxiosError: true,
      message: 'Network Error',
      response: null
    };
    mockedAxios.post.mockRejectedValueOnce(error);
    await expect(createWeapon(weaponInput)).rejects.toThrow('Erreur lors de la création: Network Error');
  });

  it('deleteWeapon handles error with null response', async () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
      response: null
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteWeapon(1)).rejects.toThrow('Erreur lors de la suppression: Network Error');
  });

  it('createWeapon handles error with response but no status', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    const error = {
      isAxiosError: true,
      message: 'Network Error',
      response: {}
    };
    mockedAxios.post.mockRejectedValueOnce(error);
    await expect(createWeapon(weaponInput)).rejects.toThrow('Erreur lors de la création: Network Error');
  });

  it('deleteWeapon handles error with response but no status', async () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
      response: {}
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteWeapon(1)).rejects.toThrow('Erreur lors de la suppression: Network Error');
  });

  it('createWeapon handles error with undefined message', async () => {
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Gun',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    const error = {
      isAxiosError: true,
      response: { status: 500 }
    };
    mockedAxios.post.mockRejectedValueOnce(error);
    await expect(createWeapon(weaponInput)).rejects.toThrow('Erreur lors de la création: undefined');
  });

  it('deleteWeapon handles error with undefined message', async () => {
    const error = {
      isAxiosError: true,
      response: { status: 500 }
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteWeapon(1)).rejects.toThrow('Erreur lors de la suppression: undefined');
  });

  it('createWeapon does not log error when NODE_ENV is test', async () => {
    (process as any).env.NODE_ENV = 'test';
    const weaponInput = {
      horodateur: '2021-01-01T00:00:00Z',
      employe_id: 1,
      detenteur: 'user',
      nom_arme: 'Test Weapon',
      serigraphie: 'none',
      prix: 100,
      cout_production: 50
    };
    const error = {
      isAxiosError: true,
      response: { status: 500, statusText: 'Internal Error' },
      message: 'Network Error'
    };
    mockedAxios.post.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(createWeapon(weaponInput)).rejects.toThrow('Erreur lors de la création: Network Error');
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('Base Weapon endpoints', () => {
  it('getBaseWeapons returns base weapons data', async () => {
    const fakeData = [{ id: 1, nom: 'Pistolet', prix_defaut: 200, cout_production_defaut: 100 }];
    mockedAxios.get.mockResolvedValueOnce({ data: fakeData });
    const result = await getBaseWeapons();
    expect(result).toEqual(fakeData);
    expect(mockedAxios.get).toHaveBeenCalledWith('/base-weapons');
  });

  it('getBaseWeapon returns a single base weapon data', async () => {
    const fakeData = { id: 1, nom: 'Pistolet', prix_defaut: 200, cout_production_defaut: 100 };
    mockedAxios.get.mockResolvedValueOnce({ data: fakeData });
    const result = await getBaseWeapon(1);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.get).toHaveBeenCalledWith('/base-weapons/1');
  });

  it('createBaseWeapon returns created base weapon data', async () => {
    const input = { nom: 'Pistolet', prix_defaut: 200, cout_production_defaut: 100 };
    const fakeData = { id: 1, ...input };
    mockedAxios.post.mockResolvedValueOnce({ data: fakeData });
    const result = await createBaseWeapon(input);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.post).toHaveBeenCalledWith('/base-weapons', input);
  });

  it('updateBaseWeapon returns updated base weapon data', async () => {
    const input = { nom: 'Pistolet', prix_defaut: 220, cout_production_defaut: 110 };
    const fakeData = { id: 1, ...input };
    mockedAxios.put.mockResolvedValueOnce({ data: fakeData });
    const result = await updateBaseWeapon(1, input);
    expect(result).toEqual(fakeData);
    expect(mockedAxios.put).toHaveBeenCalledWith('/base-weapons/1', input);
  });

  it('deleteBaseWeapon completes successfully when status is 204', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ status: 204 });
    await expect(deleteBaseWeapon(1)).resolves.toBeUndefined();
    expect(mockedAxios.delete).toHaveBeenCalledWith('/base-weapons/1', { headers: { 'Content-Type': 'application/json' } });
  });

  it('deleteBaseWeapon completes successfully when status is 200', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ status: 200 });
    await expect(deleteBaseWeapon(1)).resolves.toBeUndefined();
    expect(mockedAxios.delete).toHaveBeenCalledWith('/base-weapons/1', { headers: { 'Content-Type': 'application/json' } });
  });

  it('deleteBaseWeapon throws error for non-successful status', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ status: 500, statusText: 'Error' });
    await expect(deleteBaseWeapon(1)).rejects.toThrow('Failed to delete base weapon: Error');
  });

  it('deleteBaseWeapon rejects with not found error when status is 404', async () => {
    const error = {
      isAxiosError: true,
      response: { status: 404, statusText: 'Not Found' },
      message: 'Not Found'
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteBaseWeapon(1)).rejects.toThrow("L'arme de base avec l'ID 1 n'a pas été trouvée");
  });

  it('deleteBaseWeapon rejects with method not allowed error for 405 error', async () => {
    const error = {
      isAxiosError: true,
      response: { status: 405, statusText: 'Method Not Allowed' },
      message: 'Method Not Allowed'
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteBaseWeapon(1)).rejects.toThrow("La méthode de suppression n'est pas autorisée");
  });

  it('deleteBaseWeapon throws generic error for axios error with status other than 404 and 405', async () => {
    const error = {
      isAxiosError: true,
      response: { status: 500, statusText: 'Server Error' },
      message: 'Generic Base Error'
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteBaseWeapon(1)).rejects.toThrow('Erreur lors de la suppression: Generic Base Error');
  });

  it('deleteBaseWeapon throws error when resolved response status is not 200 or 204', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ status: 202, statusText: 'Accepted' });
    await expect(deleteBaseWeapon(1)).rejects.toThrow('Failed to delete base weapon: Accepted');
  });

  it('deleteBaseWeapon handles error without response object', async () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error'
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteBaseWeapon(1)).rejects.toThrow('Erreur lors de la suppression: Network Error');
  });

  it('deleteBaseWeapon handles error with undefined response', async () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
      response: undefined
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteBaseWeapon(1)).rejects.toThrow('Erreur lors de la suppression: Network Error');
  });

  it('deleteBaseWeapon handles error with null response', async () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
      response: null
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteBaseWeapon(1)).rejects.toThrow('Erreur lors de la suppression: Network Error');
  });

  it('deleteBaseWeapon handles error with response but no status', async () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
      response: {}
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteBaseWeapon(1)).rejects.toThrow('Erreur lors de la suppression: Network Error');
  });

  it('deleteBaseWeapon handles error with undefined message', async () => {
    const error = {
      isAxiosError: true,
      response: { status: 500 }
    };
    mockedAxios.delete.mockRejectedValueOnce(error);
    await expect(deleteBaseWeapon(1)).rejects.toThrow('Erreur lors de la suppression: undefined');
  });

  it('deleteBaseWeapon rejects with non-Axios error', async () => {
    mockedAxios.delete.mockRejectedValueOnce(new Error('Plain base error'));
    await expect(deleteBaseWeapon(1)).rejects.toThrow('Plain base error');
  });
}); 