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

class EmployeeStore {
  private employees: Map<string, Employee>;
  private storageKey = 'employeeColors';
  private initialized: boolean = false;
  private isStorageAvailable: boolean = false;
  private readonly currentVersion = 1;

  constructor() {
    this.employees = new Map();
    this.checkStorageAvailability();
    this.loadFromStorage();
    this.initializeFromBackend();
  }

  private checkStorageAvailability() {
    if (typeof window === 'undefined') {
      this.isStorageAvailable = false;
      return;
    }

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      this.isStorageAvailable = true;
    } catch (e) {
      this.isStorageAvailable = false;
      console.warn('localStorage is not available:', e);
    }
  }

  private isStorageData(data: unknown): data is StorageData {
    if (!data || typeof data !== 'object') return false;
    
    const storageData = data as StorageData;
    if (storageData.version !== this.currentVersion) return false;
    if (typeof storageData.employees !== 'object' || !storageData.employees) return false;
    
    return this.validateEmployeeData(storageData.employees);
  }

  private validateEmployeeData(data: unknown): data is Record<string, Employee> {
    if (!data || typeof data !== 'object') return false;
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof key !== 'string') return false;
      if (!this.validateEmployee(value)) return false;
    }
    
    return true;
  }

  private validateEmployee(emp: unknown): emp is Employee {
    if (!emp || typeof emp !== 'object') return false;
    
    const employee = emp as Record<string, unknown>;
    return (
      typeof employee.name === 'string' &&
      typeof employee.color === 'string' &&
      employee.color.match(/^#[0-9A-Fa-f]{6}$/) !== null &&
      typeof employee.id === 'number' &&
      (employee.role === undefined || typeof employee.role === 'string')
    );
  }

  private async initializeFromBackend() {
    try {
      // Use absolute URL for server-side rendering
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/employees`);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const employees = await response.json();
      
      // Update local cache with backend data
      employees.forEach((emp: Employee) => {
        if (this.validateEmployee(emp)) {
          this.employees.set(emp.name, emp);
        } else {
          console.warn('Invalid employee data from backend:', emp);
        }
      });
      
      this.saveToStorage();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize from backend:', error);
      // Fall back to local storage if backend fails
      this.initialized = true;
    }
  }

  private loadFromStorage() {
    if (!this.isStorageAvailable) {
      console.warn('localStorage is not available, skipping load');
      return;
    }

    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (!storedData) return;

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(storedData);
      } catch (parseError) {
        console.error('Failed to parse localStorage data:', parseError);
        this.clearStorage();
        return;
      }
      
      if (!this.isStorageData(parsedData)) {
        console.warn('Invalid data format in localStorage, clearing cache');
        this.clearStorage();
        return;
      }

      this.employees = new Map(Object.entries(parsedData.employees));
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      this.clearStorage();
    }
  }

  private clearStorage() {
    if (this.isStorageAvailable) {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }
    }
  }

  private saveToStorage() {
    if (!this.isStorageAvailable) {
      console.warn('localStorage is not available, skipping save');
      return;
    }

    try {
      const storageData: StorageData = {
        version: this.currentVersion,
        employees: Object.fromEntries(this.employees)
      };

      const serializedData = JSON.stringify(storageData);
      localStorage.setItem(this.storageKey, serializedData);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded, clearing and retrying');
        this.clearStorage();
        try {
          const storageData: StorageData = {
            version: this.currentVersion,
            employees: Object.fromEntries(this.employees)
          };
          localStorage.setItem(this.storageKey, JSON.stringify(storageData));
        } catch (retryError) {
          console.error('Failed to save to localStorage after retry:', retryError);
        }
      } else {
        console.error('Failed to save to localStorage:', error);
      }
    }
  }

  async getEmployee(name: string): Promise<Employee | undefined> {
    // Wait for initialization if not done
    if (!this.initialized) {
      await new Promise(resolve => {
        const checkInit = () => {
          if (this.initialized) {
            resolve(true);
          } else {
            setTimeout(checkInit, 100);
          }
        };
        checkInit();
      });
    }
    return this.employees.get(name);
  }

  async setEmployeeColor(name: string, color: string) {
    const employee = this.employees.get(name);
    const employeeData = {
      name,
      color,
      role: employee?.role || 'EMPLOYEE'
    };

    try {
      // If employee exists, update it, otherwise create new
      const method = employee?.id ? 'PUT' : 'POST';
      const url = employee?.id ? `/api/employees/${employee.id}` : '/api/employees';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        throw new Error('Failed to update employee');
      }

      const updatedEmployee = await response.json();
      this.employees.set(name, updatedEmployee);
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to sync employee color:', error);
      // Update local state even if backend fails
      this.employees.set(name, { ...employeeData, id: employee?.id || -1 });
      this.saveToStorage();
    }
  }

  async renameEmployee(oldName: string, newName: string) {
    const employee = this.employees.get(oldName);
    if (!employee) return;

    try {
      if (employee.id) {
        const response = await fetch(`/api/employees/${employee.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...employee,
            name: newName,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to rename employee');
        }

        const updatedEmployee = await response.json();
        this.employees.delete(oldName);
        this.employees.set(newName, updatedEmployee);
      }
    } catch (error) {
      console.error('Failed to sync employee rename:', error);
    }
    
    // Update local state even if backend fails
    this.employees.delete(oldName);
    this.employees.set(newName, { ...employee, name: newName });
    this.saveToStorage();
  }

  async mergeEmployees(names: string[], targetName: string) {
    const targetEmployee = this.employees.get(targetName);
    if (!targetEmployee) return;

    try {
      // Get all weapons from other employees and reassign them to target
      for (const name of names) {
        if (name === targetName) continue;
        const employee = this.employees.get(name);
        if (employee?.id) {
          await fetch(`/api/employees/reassign-weapons?from_employee_id=${employee.id}&to_employee_id=${targetEmployee.id}`, {
            method: 'POST',
          });
          
          // Delete the source employee
          await fetch(`/api/employees/${employee.id}`, {
            method: 'DELETE',
          });
        }
      }
    } catch (error) {
      console.error('Failed to merge employees:', error);
    }

    // Update local state
    names.forEach(name => {
      if (name !== targetName) {
        this.employees.delete(name);
      }
    });
    this.saveToStorage();
  }

  // Helper method to check if store is ready
  async waitForInitialization() {
    if (this.initialized) return;
    
    return new Promise(resolve => {
      const checkInit = () => {
        if (this.initialized) {
          resolve(true);
        } else {
          setTimeout(checkInit, 100);
        }
      };
      checkInit();
    });
  }
}

export const employeeStore = new EmployeeStore(); 