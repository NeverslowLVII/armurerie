import type { Role } from "@prisma/client";
import {
	type PayloadAction,
	createAsyncThunk,
	createSlice,
} from "@reduxjs/toolkit";

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

export const fetchUsers = createAsyncThunk("users/fetchUsers", async () => {
	const response = await fetch("/api/employees");
	if (!response.ok) {
		throw new Error("Failed to fetch users");
	}
	return await response.json();
});

export const updateUser = createAsyncThunk(
	"users/updateUser",
	async ({ id, data }: { id?: number; data: Partial<User> }) => {
		const method = id ? "PUT" : "POST";
		const url = id ? `/api/employees/${id}` : "/api/employees";

		const response = await fetch(url, {
			method,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error("Update user failed:", {
				status: response.status,
				statusText: response.statusText,
				errorData,
				requestData: data,
			});
			throw new Error(errorData.error || "Failed to update user");
		}

		const result = await response.json();
		return result;
	},
);

export const mergeUsers = createAsyncThunk(
	"users/mergeUsers",
	async ({ names, targetName }: { names: string[]; targetName: string }) => {
		const response = await fetch("/api/employees/merge", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ names, targetName }),
		});

		if (!response.ok) {
			throw new Error("Failed to merge users");
		}
		return await response.json();
	},
);

export const deleteUser = createAsyncThunk(
	"users/deleteUser",
	async (id: number) => {
		const response = await fetch(`/api/employees/${id}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			throw new Error("Failed to delete user");
		}
		return id;
	},
);

const userSlice = createSlice({
	name: "users",
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder

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
				state.error = action.error.message || "Failed to fetch users";
			})

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
				state.error = action.error.message || "Failed to update user";
			})

			.addCase(mergeUsers.fulfilled, (state, action) => {
				const { names, targetUser } = action.payload;

				const usersMap = new Map(Object.entries(state.users));

				for (const name of names) {
					usersMap.delete(name);
				}

				if (targetUser && typeof targetUser.name === "string") {
					usersMap.set(targetUser.name, targetUser);
				}

				state.users = Object.fromEntries(usersMap);
			})

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
				state.error = action.error.message || "Failed to delete user";
			});
	},
});

export const { setInitialized } = userSlice.actions;
export default userSlice.reducer;
