import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Role } from '@prisma/client';

export interface Employee {
  id: number;
  name: string;
  color: string | null;
  role: Role;
  email: string;
  password?: string;
  contractUrl?: string | null;
}

interface EmployeeState {
  employees: Record<string, Employee>;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: EmployeeState = {
  employees: {},
  loading: false,
  error: null,
  initialized: false,
};

// Async thunks
export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async () => {
    const response = await fetch('/api/employees');
    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }
    return await response.json();
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/updateEmployee',
  async ({ id, data }: { id?: number; data: Partial<Employee> }) => {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/employees/${id}` : '/api/employees';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update employee');
    }
    return await response.json();
  }
);

export const mergeEmployees = createAsyncThunk(
  'employees/mergeEmployees',
  async ({ names, targetName }: { names: string[], targetName: string }) => {
    const response = await fetch('/api/employees/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ names, targetName }),
    });

    if (!response.ok) {
      throw new Error('Failed to merge employees');
    }
    return await response.json();
  }
);

export const deleteEmployee = createAsyncThunk(
  'employees/deleteEmployee',
  async (id: number) => {
    const response = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete employee');
    }
    return id;
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch employees
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        const employeesRecord: Record<string, Employee> = {};
        action.payload.forEach((emp: Employee) => {
          employeesRecord[emp.name] = emp;
        });
        state.employees = employeesRecord;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch employees';
      })
      // Update employee
      .addCase(updateEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.employees[action.payload.id] = action.payload;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update employee';
      })
      // Merge employees
      .addCase(mergeEmployees.fulfilled, (state, action) => {
        const { names, targetEmployee } = action.payload;
        names.forEach((name: string) => {
          delete state.employees[name];
        });
        state.employees[targetEmployee.name] = targetEmployee;
      })
      // Delete employee
      .addCase(deleteEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.loading = false;
        delete state.employees[action.payload];
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete employee';
      });
  },
});

export const { setInitialized } = employeeSlice.actions;
export default employeeSlice.reducer; 