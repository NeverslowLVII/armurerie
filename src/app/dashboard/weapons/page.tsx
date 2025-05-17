"use client";

import WeaponsTable from "@/components/WeaponsTable";

export default function WeaponsPage() {
	return (
		<div className="container mx-auto py-6">
			<div className="rounded-lg bg-background p-6 shadow-lg dark:bg-zinc-800 dark:shadow-zinc-700">
				<WeaponsTable />
			</div>
		</div>
	);
}
