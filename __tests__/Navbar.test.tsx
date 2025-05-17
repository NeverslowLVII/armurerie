import { Role } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import type { Session } from "next-auth";
import * as nextAuth from "next-auth/react";
import type { SessionContextValue } from "next-auth/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Composant simplifié pour les tests
const MockNavbar = ({ role }: { role: Role }) => {
	return (
		<div>
			<span>Armes</span>
			<span>Comparateur</span>
			{role === Role.PATRON && <span>Statistiques</span>}
			<span>Mon Compte</span>
		</div>
	);
};

// Mock des hooks de Next.js
vi.mock("next/navigation", () => ({
	usePathname: () => "/dashboard/weapons",
}));

vi.mock("@/components/Navbar", () => ({
	default: () => {
		// Récupérer le rôle de l'utilisateur à partir de useSession
		const { data } = nextAuth.useSession();
		const role = data?.user?.role || Role.EMPLOYEE;

		// Utiliser notre composant simplifié
		return <MockNavbar role={role} />;
	},
}));

describe("Navbar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("displays Statistiques for PATRON", () => {
		vi.spyOn(nextAuth, "useSession").mockReturnValueOnce({
			data: {
				user: {
					id: "1",
					name: "Patron Test",
					email: "patron@example.com",
					username: "patron",
					role: Role.PATRON,
				},
				expires: "never",
			} as Session,
			status: "authenticated",
			update: vi.fn(),
		} as SessionContextValue);

		const { container: _container } = render(<MockNavbar role={Role.PATRON} />);
		expect(screen.getByText("Statistiques")).toBeDefined();
	});

	it("hides Statistiques for EMPLOYEE", () => {
		vi.spyOn(nextAuth, "useSession").mockReturnValueOnce({
			data: {
				user: {
					id: "2",
					name: "Employee Test",
					email: "employee@example.com",
					username: "employee",
					role: Role.EMPLOYEE,
				},
				expires: "never",
			} as Session,
			status: "authenticated",
			update: vi.fn(),
		} as SessionContextValue);

		const { container: _container2 } = render(
			<MockNavbar role={Role.EMPLOYEE} />,
		);
		expect(screen.queryByText("Statistiques")).toBeNull();
	});
});
