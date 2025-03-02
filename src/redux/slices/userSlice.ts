import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Role } from '@prisma/client';

export interface User {
  id: number;
  name: string;
  username: string;
  color: string | null;
  role: Role;
  email: string;
  password?: string;
  contractUrl?: string | null;
  commission?: number;
  lastLogin?: Date;
}

interface UserState {
  users: Record<string, User>;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: UserState = {
  users: {},
  loading: false,
  error: null,
  initialized: false,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async () => {
    const response = await fetch('/api/employees');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return await response.json();
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }: { id?: number; data: Partial<User> }) => {
    console.log('updateUser thunk called with:', { id, data });
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/employees/${id}` : '/api/employees';
    
    console.log('Making request to:', { method, url });
    console.log('Request body:', JSON.stringify(data, null, 2));
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Update user failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestData: data
      });
      throw new Error(errorData.error || 'Failed to update user');
    }
    
    const result = await response.json();
    console.log('Update user success:', result);
    return result;
  }
);

export const mergeUsers = createAsyncThunk(
  'users/mergeUsers',
  async ({ names, targetName }: { names: string[], targetName: string }) => {
    const response = await fetch('/api/employees/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ names, targetName }),
    });

    if (!response.ok) {
      throw new Error('Failed to merge users');
    }
    return await response.json();
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: number) => {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    return id;
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        const usersRecord: Record<string, User> = {};
        for (const user of action.payload) {
          usersRecord[user.name] = user;
        }
        state.users = usersRecord;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users[action.payload.name] = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update user';
      })
      // Merge users
      .addCase(mergeUsers.fulfilled, (state, action) => {
        const { names, targetUser } = action.payload;
        
        // Create a new Map from the current users
        const usersMap = new Map(Object.entries(state.users));
        
        // Remove merged users
        for (const name of names) {
          usersMap.delete(name);
        }
        
        // Add target user safely
        if (targetUser && typeof targetUser.name === 'string') {
          usersMap.set(targetUser.name, targetUser);
        }
        
        // Convert Map back to object and update state
        state.users = Object.fromEntries(usersMap);
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        delete state.users[action.payload];
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete user';
      });
  },
});

// For backward compatibility
export type Employee = User;
export type EmployeeState = UserState;
export const fetchEmployees = fetchUsers;
export const updateEmployee = updateUser;
export const deleteEmployee = deleteUser;
export const mergeEmployees = mergeUsers;

export const { setInitialized } = userSlice.actions;
export default userSlice.reducer; 