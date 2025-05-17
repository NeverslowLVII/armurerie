import { vi } from "vitest";

const mockSession = {
	data: null,
	status: "unauthenticated",
};

export const useSession = vi.fn(() => mockSession);
export const signIn = vi.fn();
export const signOut = vi.fn();
export const getSession = vi.fn();

const NextAuthReactMock = {
	useSession,
	signIn,
	signOut,
	getSession,
};

export default NextAuthReactMock;
