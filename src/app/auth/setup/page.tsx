"use client";

import armurerie from "@/assets/armurerie.webp";
import SetupForm from "@/features/auth/components/SetupForm";
import { RandomQuote } from "@/components/ui/RandomQuote";
import { SkeletonLoading } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import Image from "next/image";
import { Suspense } from "react";

export default function SetupPage() {
	return (
		<div className="container relative grid min-h-screen flex-col items-center justify-center bg-background dark:bg-zinc-900 lg:max-w-none lg:grid-cols-2 lg:px-0">
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
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
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
							Configuration
						</motion.h1>
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5, delay: 0.3 }}
							className="text-sm text-zinc-500 dark:text-zinc-400"
						>
							Choisissez votre mot de passe pour activer votre compte
						</motion.p>
					</div>
					<Suspense
						fallback={
							<SkeletonLoading isLoading={true} className="space-y-4">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="mx-auto h-10 w-32" />
							</SkeletonLoading>
						}
					>
						<SetupForm />
					</Suspense>
				</div>
			</motion.div>
		</div>
	);
}
