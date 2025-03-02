interface User {
  id: number;
  name: string;
  color: string;
  role?: string;
}

interface StorageData {
  version: 1;
  users: Record<string, User>;
}

class UserStore {
  private users: Map<string, User>;
  private storageKey = 'userColors';
  private initialized: boolean = false;
  private isStorageAvailable: boolean = false;
  private readonly currentVersion = 1;

  constructor() {
    this.users = new Map();
    this.checkStorageAvailability();
    this.loadFromStorage();
    this.initializeFromBackend();
  }

  private checkStorageAvailability() {
    if (typeof globalThis === 'undefined') {
      this.isStorageAvailable = false;
      return;
    }

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      this.isStorageAvailable = true;
    } catch (error) {
      this.isStorageAvailable = false;
      if (process.env.NODE_ENV === 'development') {
        console.warn('localStorage is not available:', error);
      }
    }
  }

  private isStorageData(data: unknown): data is StorageData {
    if (!data || typeof data !== 'object') return false;
    
    const storageData = data as StorageData;
    if (storageData.version !== this.currentVersion) return false;
    if (typeof storageData.users !== 'object' || !storageData.users) return false;
    
    return this.validateUserData(storageData.users);
  }

  private validateUserData(data: unknown): data is Record<string, User> {
    if (!data || typeof data !== 'object') return false;
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof key !== 'string') return false;
      if (!this.validateUser(value)) return false;
    }
    
    return true;
  }

  private validateUser(user: unknown): user is User {
    if (!user || typeof user !== 'object') return false;
    
    const userObj = user as Record<string, unknown>;
    return (
      typeof userObj.name === 'string' &&
      typeof userObj.color === 'string' &&
      userObj.color.match(/^#[0-9A-Fa-f]{6}$/) !== null &&
      typeof userObj.id === 'number' &&
      (userObj.role === undefined || typeof userObj.role === 'string')
    );
  }

  private async initializeFromBackend() {
    try {
      // Use absolute URL for server-side rendering
      const baseUrl = typeof globalThis === 'undefined' 
        ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        : globalThis.location.origin;
      const response = await fetch(`${baseUrl}/api/employees`);
      if (response.ok) {
        const data = await response.json();
        // Update local cache with backend data
        for (const user of data) {
          if (this.validateUser(user)) {
            this.users.set(user.name, user);
          } else {
            console.warn('Invalid user data from backend:', user);
          }
        }
        
        this.saveToStorage();
        this.initialized = true;
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Failed to initialize from backend:', error);
      // Fall back to local storage if backend fails
      this.initialized = true;
    }
  }

  private loadFromStorage() {
    if (!this.isStorageAvailable) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('localStorage is not available, skipping load');
      }
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

      this.users = new Map(Object.entries(parsedData.users));
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
        users: Object.fromEntries(this.users)
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
            users: Object.fromEntries(this.users)
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

  async getUser(name: string): Promise<User | undefined> {
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
    return this.users.get(name);
  }

  async setUserColor(name: string, color: string) {
    const user = this.users.get(name);
    const userData = {
      name,
      color,
      role: user?.role || 'EMPLOYEE'
    };

    try {
      // If user exists, update it, otherwise create new
      const method = user?.id ? 'PUT' : 'POST';
      const url = user?.id ? `/api/employees/${user.id}` : '/api/employees';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      this.users.set(name, updatedUser);
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to sync user color:', error);
      // Update local state even if backend fails
      this.users.set(name, { ...userData, id: user?.id || -1 });
      this.saveToStorage();
    }
  }

  async renameUser(oldName: string, newName: string) {
    const user = this.users.get(oldName);
    if (!user) return;

    try {
      if (user.id) {
        const response = await fetch(`/api/employees/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...user,
            name: newName,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to rename user');
        }

        const updatedUser = await response.json();
        this.users.delete(oldName);
        this.users.set(newName, updatedUser);
        this.saveToStorage();
      }
    } catch (error) {
      console.error('Failed to rename user:', error);
      // Update local state even if backend fails
      this.users.delete(oldName);
      this.users.set(newName, { ...user, name: newName });
      this.saveToStorage();
    }
  }

  async mergeUsers(names: string[], targetName: string) {
    const targetUser = this.users.get(targetName);
    if (!targetUser) return;

    try {
      for (const name of names) {
        if (name === targetName) continue;
        const user = this.users.get(name);
        if (user?.id) {
          await fetch(`/api/employees/reassign-weapons?from_user_id=${user.id}&to_user_id=${targetUser.id}`, {
            method: 'POST',
          });
          
          await fetch(`/api/employees/${user.id}`, {
            method: 'DELETE',
          });
        }
      }

      // Update local state
      for (const name of names) {
        if (name !== targetName) {
          this.users.delete(name);
        }
      }
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to merge users:', error);
    }
  }

  async waitForInitialization() {
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
  }
}

export const userStore = new UserStore(); 