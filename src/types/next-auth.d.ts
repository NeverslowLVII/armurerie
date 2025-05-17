import type { Role } from "@prisma/client";

declare module "next-auth" {
	interface User {
		id: string;
		role: Role;
		name?: string | null;
		email?: string | null;
		username?: string | null;
	}

	interface Session {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			username?: string | null;
			role: Role;
			color?: string | null;
		};
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		role: Role;
		username?: string | null;
	}
}
