import { act, renderHook } from "@testing-library/react";
import type { Session } from "next-auth";
import * as nextAuth from "next-auth/react";
import type {
	SessionContextValue,
	SignInResponse,
	SignOutResponse,
} from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Hook d'authentification simulé
const useAuth = () => {
	const { data: session, status } = nextAuth.useSession();
	const isAuthenticated = status === "authenticated";
	const isLoading = status === "loading";

	const login = async (credentials: { email: string; password: string }) => {
		return nextAuth.signIn("credentials", credentials);
	};

	const logout = async () => {
		return nextAuth.signOut();
	};

	return {
		user: session?.user,
		isAuthenticated,
		isLoading,
		login,
		logout,
	};
};

// Tests
describe("useAuth Hook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return unauthenticated state by default", () => {
		vi.spyOn(nextAuth, "useSession").mockReturnValueOnce({
			data: null,
			status: "unauthenticated",
			update: vi.fn(),
		} as SessionContextValue);

		const { result } = renderHook(() => useAuth());

		expect(result.current.isAuthenticated).toBe(false);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.user).toBeUndefined();
	});

	it("should return authenticated state when session exists", () => {
		vi.spyOn(nextAuth, "useSession").mockReturnValueOnce({
			data: {
				user: {
					id: "1",
					name: "Test User",
					email: "test@example.com",
				},
				expires: "never",
			} as Session,
			status: "authenticated",
			update: vi.fn(),
		} as SessionContextValue);

		const { result } = renderHook(() => useAuth());

		expect(result.current.isAuthenticated).toBe(true);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.user).toEqual({
			id: "1",
			name: "Test User",
			email: "test@example.com",
		});
	});

	it("should call signIn when login is called", async () => {
		const signInMock = vi
			.spyOn(nextAuth, "signIn")
			.mockResolvedValueOnce({ ok: true, error: null } as SignInResponse);
		vi.spyOn(nextAuth, "useSession").mockReturnValue({
			data: null,
			status: "unauthenticated",
			update: vi.fn(),
		} as SessionContextValue);

		const { result } = renderHook(() => useAuth());

		const credentials = { email: "test@example.com", password: "password123" };
		await act(async () => {
			await result.current.login(credentials);
		});

		expect(signInMock).toHaveBeenCalledWith("credentials", credentials);
	});

	it("should call signOut when logout is called", async () => {
		const signOutMock = vi
			.spyOn(nextAuth, "signOut")
			.mockResolvedValueOnce({ url: "/login" } as SignOutResponse);
		vi.spyOn(nextAuth, "useSession").mockReturnValue({
			data: {
				user: { name: "Test User" },
				expires: "never",
			} as Partial<Session>,
			status: "authenticated",
			update: vi.fn(),
		} as SessionContextValue);

		const { result } = renderHook(() => useAuth());

		await act(async () => {
			await result.current.logout();
		});

		expect(signOutMock).toHaveBeenCalled();
	});
});
