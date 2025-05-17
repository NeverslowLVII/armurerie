"use client";

import { getQuoteByStableId } from "@/data/quotes";
import { motion } from "framer-motion";
import { useEffect, useId, useState } from "react";

interface RandomQuoteProps {
	className?: string;
}

export function RandomQuote({ className = "" }: RandomQuoteProps) {
	// Générer un ID stable pour ce composant
	const id = useId();

	// Utiliser une citation basée sur l'ID stable pour le rendu initial
	const [quote, _setQuote] = useState(() => getQuoteByStableId(id));
	const [_isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
			className={`relative z-20 mt-auto ${className}`}
		>
			<blockquote className="space-y-2">
				<p className="text-lg font-medium italic text-zinc-100">
					&ldquo;{quote.text}&rdquo;
				</p>
				<footer className="text-sm text-zinc-300">
					<span className="font-semibold">{quote.author}</span>
					{quote.year && (
						<span className="text-zinc-400 before:mx-2 before:content-['—']">
							{quote.year}
						</span>
					)}
				</footer>
			</blockquote>
		</motion.div>
	);
}
