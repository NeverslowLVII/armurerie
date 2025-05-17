import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function StatisticsLayout({
	children,
}: { children: React.ReactNode }) {
	const session = await getServerSession(authOptions);

	if (
		!session ||
		(session.user.role !== Role.PATRON && session.user.role !== Role.DEVELOPER)
	) {
		redirect("/dashboard/weapons");
	}
	return <>{children}</>;
}
