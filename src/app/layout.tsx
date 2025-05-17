import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { initializeApp } from "@/lib/init";
import { Providers } from "./providers";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
	title: "Armurerie",
	description: "Gestion d'armes",
	icons: {
		icon: "/favicon.ico",
	},
};

try {
	await initializeApp();
} catch (error) {
	console.error("Failed to initialize app:", error);
}

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<html lang="fr" suppressHydrationWarning>
			<body className={`${poppins.className}`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
