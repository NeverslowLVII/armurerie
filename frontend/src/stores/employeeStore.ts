interface Employee {
    name: string;
    color: string;
  }
  
  class EmployeeStore {
    private employees: Map<string, Employee>;
    private storageKey = 'employeeColors';
  
    constructor() {
      this.employees = new Map();
      this.loadFromStorage();
    }
  
    private loadFromStorage() {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        const data = JSON.parse(storedData);
        this.employees = new Map(Object.entries(data));
      }
    }
  
    private saveToStorage() {
      const data = Object.fromEntries(this.employees);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  
    getEmployee(name: string): Employee | undefined {
      return this.employees.get(name);
    }
  
    setEmployeeColor(name: string, color: string) {
      this.employees.set(name, { name, color });
      this.saveToStorage();
    }
  
    renameEmployee(oldName: string, newName: string) {
      const employee = this.employees.get(oldName);
      if (employee) {
        this.employees.delete(oldName);
        this.employees.set(newName, { ...employee, name: newName });
        this.saveToStorage();
      }
    }
  
    mergeEmployees(names: string[], targetName: string) {
      const targetEmployee = this.employees.get(targetName);
      if (!targetEmployee) return;
  
      // Supprimer les autres entrées
      names.forEach(name => {
        if (name !== targetName) {
          this.employees.delete(name);
        }
      });
  
      this.saveToStorage();
    }
  }
  
  export const employeeStore = new EmployeeStore(); 