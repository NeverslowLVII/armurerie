import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';

interface Employee {
  id: number;
  name: string;
  color: string;
  role?: string;
}

interface StorageData {
  version: 1;
  employees: Record<string, Employee>;
}

interface EmployeeState {
  employees: Map<string, Employee>;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

type EmployeeAction =
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'SET_EMPLOYEE'; payload: { name: string; employee: Employee } }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'MERGE_EMPLOYEES'; payload: { names: string[]; targetName: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean };

interface EmployeeContextType {
  state: EmployeeState;
  setEmployeeColor: (name: string, color: string) => Promise<void>;
  renameEmployee: (oldName: string, newName: string) => Promise<void>;
  mergeEmployees: (names: string[], targetName: string) => Promise<void>;
  getEmployee: (name: string) => Promise<Employee | undefined>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

function employeeReducer(state: EmployeeState, action: EmployeeAction): EmployeeState {
  switch (action.type) {
    case 'SET_EMPLOYEES': {
      const newMap = new Map();
      action.payload.forEach(emp => newMap.set(emp.name, emp));
      return { ...state, employees: newMap };
    }
    case 'SET_EMPLOYEE':
      return {
        ...state,
        employees: new Map(state.employees).set(action.payload.name, action.payload.employee),
      };
    case 'DELETE_EMPLOYEE': {
      const newMap = new Map(state.employees);
      newMap.delete(action.payload);
      return { ...state, employees: newMap };
    }
    case 'MERGE_EMPLOYEES': {
      const newMap = new Map(state.employees);
      action.payload.names.forEach(name => {
        if (name !== action.payload.targetName) {
          newMap.delete(name);
        }
      });
      return { ...state, employees: newMap };
    }
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    default:
      return state;
  }
}

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(employeeReducer, {
    employees: new Map(),
    isLoading: false,
    error: null,
    initialized: false,
  });

  const storage = useMemo(() => ({
    init() {
      if (typeof window === 'undefined') return;
      const version = localStorage.getItem('employeeStorageVersion');
      if (!version) {
        localStorage.setItem('employeeStorageVersion', '1');
      }
    },

    validateEmployee(emp: unknown): emp is Employee {
      return typeof emp === 'object' && emp !== null &&
        'id' in emp && typeof (emp as any).id === 'number' &&
        'name' in emp && typeof (emp as any).name === 'string' &&
        'color' in emp && typeof (emp as any).color === 'string';
    },

    validateStorageData(data: unknown): data is StorageData {
      return typeof data === 'object' && data !== null &&
        'version' in data && (data as any).version === 1 &&
        'employees' in data && typeof (data as any).employees === 'object';
    },

    save(employees: Map<string, Employee>) {
      if (typeof window === 'undefined') return;
      try {
        const data: StorageData = {
          version: 1,
          employees: Object.fromEntries(employees)
        };
        localStorage.setItem('employees', JSON.stringify(data));
      } catch (error) {
        console.error('Error saving employees to localStorage:', error);
      }
    },

    load(): Map<string, Employee> {
      if (typeof window === 'undefined') return new Map();
      try {
        const data = JSON.parse(localStorage.getItem('employees') || '{}');
        if (!this.validateStorageData(data)) return new Map();
        
        const employees = new Map<string, Employee>();
        Object.entries(data.employees).forEach(([name, emp]) => {
          if (this.validateEmployee(emp)) {
            employees.set(name, emp);
          }
        });
        return employees;
      } catch (error) {
        console.error('Error loading employees from localStorage:', error);
        return new Map();
      }
    }
  }), []);

  const initialize = useCallback(async () => {
    if (!state.initialized) {
      storage.init();
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Load from localStorage first
        const storedEmployees = storage.load();
        if (storedEmployees.size > 0) {
          dispatch({ type: 'SET_EMPLOYEES', payload: Array.from(storedEmployees.values()) });
        }

        // Then fetch from backend
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/employees`);
        if (!response.ok) throw new Error('Failed to fetch employees');
        
        const employees: Employee[] = await response.json();
        dispatch({ type: 'SET_EMPLOYEES', payload: employees });
        storage.save(new Map(employees.map(emp => [emp.name, emp])));
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to initialize' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    }
  }, [state.initialized, storage]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // API methods
  const setEmployeeColor = async (name: string, color: string) => {
    const employee = state.employees.get(name);
    const employeeData = {
      name,
      color,
      role: employee?.role || 'EMPLOYEE',
    };

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const method = employee?.id ? 'PUT' : 'POST';
      const url = employee?.id ? `/api/employees/${employee.id}` : '/api/employees';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) throw new Error('Failed to update employee');
      
      const updatedEmployee = await response.json();
      dispatch({ type: 'SET_EMPLOYEE', payload: { name, employee: updatedEmployee } });
      storage.save(state.employees);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update employee' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const renameEmployee = async (oldName: string, newName: string) => {
    const employee = state.employees.get(oldName);
    if (!employee) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (employee.id) {
        const response = await fetch(`/api/employees/${employee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...employee, name: newName }),
        });

        if (!response.ok) throw new Error('Failed to rename employee');
        
        const updatedEmployee = await response.json();
        dispatch({ type: 'DELETE_EMPLOYEE', payload: oldName });
        dispatch({ type: 'SET_EMPLOYEE', payload: { name: newName, employee: updatedEmployee } });
      }
      
      storage.save(state.employees);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to rename employee' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const mergeEmployees = async (names: string[], targetName: string) => {
    const targetEmployee = state.employees.get(targetName);
    if (!targetEmployee) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      for (const name of names) {
        if (name === targetName) continue;
        const employee = state.employees.get(name);
        if (employee?.id) {
          await fetch(`/api/employees/reassign-weapons?from_employee_id=${employee.id}&to_employee_id=${targetEmployee.id}`, {
            method: 'POST',
          });
          
          await fetch(`/api/employees/${employee.id}`, {
            method: 'DELETE',
          });
        }
      }

      dispatch({ type: 'MERGE_EMPLOYEES', payload: { names, targetName } });
      storage.save(state.employees);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to merge employees' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getEmployee = async (name: string): Promise<Employee | undefined> => {
    if (!state.initialized) {
      await new Promise<void>(resolve => {
        const checkInit = () => {
          if (state.initialized) {
            resolve();
          } else {
            setTimeout(checkInit, 100);
          }
        };
        checkInit();
      });
    }
    return state.employees.get(name);
  };

  const value = {
    state,
    setEmployeeColor,
    renameEmployee,
    mergeEmployees,
    getEmployee,
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
} 