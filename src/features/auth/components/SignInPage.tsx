"use client";

import armurerie from "@/assets/armurerie.webp";
import { RandomQuote } from "@/components/ui/RandomQuote";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams?.get("callbackUrl") || "/";
	const setup = searchParams?.get("setup");
	const reset = searchParams?.get("reset");

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");

	async function onSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);

		try {
			setIsLoading(true);
			const result = await signIn("credentials", {
				identifier,
				password,
				redirect: false,
			});

			if (!result?.ok) {
				throw new Error("Identifiants invalides");
			}

			router.push(callbackUrl);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Une erreur est survenue",
			);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="container relative grid h-screen flex-col items-center justify-center bg-background dark:bg-zinc-900 lg:max-w-none lg:grid-cols-2 lg:px-0">
			<div className="relative hidden h-full flex-col overflow-hidden bg-muted p-10 text-white lg:flex">
				<div className="absolute inset-0">
					<Image
						src={armurerie}
						alt="Armurerie background"
						fill
						className="object-cover transition-transform duration-500 hover:scale-105"
						priority
						quality={100}
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 backdrop-blur-[2px]" />
				</div>
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="relative z-20 flex items-center"
				>
					<span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-2xl font-bold text-transparent">
						Armurerie
					</span>
				</motion.div>
				<RandomQuote />
			</div>
			<motion.div
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.5 }}
				className="lg:p-8"
			>
				<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
					<div className="flex flex-col space-y-2 text-center">
						<motion.h1
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.2 }}
							className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white"
						>
							Connexion
						</motion.h1>
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5, delay: 0.3 }}
							className="text-sm text-zinc-500 dark:text-zinc-400"
						>
							Entrez vos identifiants pour accéder à votre espace
						</motion.p>
					</div>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.4 }}
					>
						<div className="grid gap-6">
							{setup && (
								<AlertDialog open={!!setup}>
									<AlertDialogContent>
										<AlertDialogTitle className="sr-only">
											Succès
										</AlertDialogTitle>
										<AlertDialogDescription>
											Votre compte a été configuré avec succès. Vous pouvez
											maintenant vous connecter.
										</AlertDialogDescription>
										<Button
											className="mt-4"
											onClick={() => router.replace("/auth/signin")}
										>
											Fermer
										</Button>
									</AlertDialogContent>
								</AlertDialog>
							)}
							{reset && (
								<AlertDialog open={!!reset}>
									<AlertDialogContent>
										<AlertDialogTitle className="sr-only">
											Succès
										</AlertDialogTitle>
										<AlertDialogDescription>
											Votre mot de passe a été réinitialisé avec succès. Vous
											pouvez maintenant vous connecter.
										</AlertDialogDescription>
										<Button
											className="mt-4"
											onClick={() => router.replace("/auth/signin")}
										>
											Fermer
										</Button>
									</AlertDialogContent>
								</AlertDialog>
							)}
							<form
								onSubmit={onSubmit}
								className="space-y-4 rounded-lg bg-background p-4 dark:bg-zinc-900"
							>
								<div className="space-y-2">
									<Label htmlFor="identifier">
										Email ou nom d&apos;utilisateur
									</Label>
									<Input
										id="identifier"
										name="identifier"
										type="text"
										placeholder="nom@exemple.fr"
										value={identifier}
										onChange={(e) => setIdentifier(e.target.value)}
										disabled={isLoading}
										required
										className="dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
									/>
								</div>
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label htmlFor="password">Mot de passe</Label>
										<Link
											href="/auth/reset"
											className="text-sm text-muted-foreground hover:text-primary"
										>
											Mot de passe oublié ?
										</Link>
									</div>
									<Input
										id="password"
										name="password"
										type="password"
										placeholder="••••••••"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										disabled={isLoading}
										required
										className="dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
									/>
								</div>
								{error && (
									<AlertDialog open={!!error}>
										<AlertDialogContent>
											<AlertDialogTitle className="sr-only">
												Erreur
											</AlertDialogTitle>
											<AlertDialogDescription className="text-red-500">
												{error}
											</AlertDialogDescription>
											<Button
												className="mt-4"
												onClick={() => setError(null)}
											>
												Fermer
											</Button>
										</AlertDialogContent>
									</AlertDialog>
								)}
								<Button
									type="submit"
									className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white transition-all hover:from-red-600 hover:to-orange-600 hover:shadow-lg active:scale-95 dark:text-white"
									disabled={isLoading}
								>
									<LoadingButton loading={isLoading} spinnerSize="sm">
										Se connecter
									</LoadingButton>
								</Button>
							</form>
						</div>
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5, delay: 0.6 }}
							className="px-8 text-center text-sm text-muted-foreground"
						>
							En cliquant sur continuer, vous acceptez nos{" "}
							<Link
								href="/terms"
								className="underline underline-offset-4 hover:text-primary"
							>
								Conditions d&apos;utilisation
							</Link>{" "}
							et notre{" "}
							<Link
								href="/privacy"
								className="underline underline-offset-4 hover:text-primary"
							>
								Politique de confidentialité
							</Link>
							.
						</motion.p>
					</motion.div>
				</div>
			</motion.div>
		</div>
	);
} 