import type { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";

type SessionUser = Session["user"] & {
	id: string;
	role: Role;
};

export function useUserRole() {
	const { data: session, status } = useSession();

	const user = session?.user as SessionUser | undefined;

	const isAdmin = user?.role
		? ["PATRON", "CO_PATRON", "DEVELOPER"].includes(user.role)
		: false;

	const role = user?.role;
	const userId = user?.id ? Number(user.id) : undefined;

	return {
		role,
		userId,
		isAdmin,
		isAuthenticated: status === "authenticated",
		isLoading: status === "loading",
		user,
	};
}
