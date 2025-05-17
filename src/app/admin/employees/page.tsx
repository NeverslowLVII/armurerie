import UsersAdminClient from "@/components/admin/UsersAdminClient";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Gestion des Utilisateurs - Armurerie",
	description: "Administration des comptes utilisateurs",
};

interface SelectedUser {
	id: number;
	name: string;
	role: Role;
	color: string | null;
	email: string;
	contractUrl: string | null;
}

async function getUsers(): Promise<SelectedUser[]> {
	return prisma.user.findMany({
		orderBy: { name: "asc" },
		select: {
			id: true,
			name: true,
			role: true,
			color: true,
			email: true,
			contractUrl: true,
		},
	});
}

export default async function UsersAdminPage() {
	const session = await getServerSession(authOptions);

	if (!session || session.user.role !== "PATRON") {
		redirect("/dashboard");
	}

	const users = await getUsers();

	return <UsersAdminClient users={users} />;
}
