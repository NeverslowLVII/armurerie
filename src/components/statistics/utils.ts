import type { DateRange } from "./types";

export const normalizeWeaponName = (name: string): string => {
	const lowerName = name.toLowerCase().trim();

	const mapping: { [key: string]: string } = {
		scofield: "Scofield",
		pompe: "Fusil à Pompe",
		verrou: "Fusil à Verrou",
		navy: "Revolver Navy",
		volcanic: "Pistolet Volcanic",
		henry: "Carabine Henry",
		winchester: "Carabine Winchester",
		cattleman: "Revolver Cattleman",
		"rolling block": "Fusil Rolling Block",
		"double action": "Revolver Double Action",
	};

	for (const [key, value] of Object.entries(mapping)) {
		if (lowerName.includes(key)) {
			return value;
		}
	}
	return lowerName.charAt(0).toUpperCase() + lowerName.slice(1);
};

export const formatDateForInput = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const formatDollars = (amount: number) => {
	const dollars = amount / 100;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(dollars);
};

export const formatDate = (date: Date): string => {
	return new Intl.DateTimeFormat("us-US", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
};

export const getPresets = (): Array<DateRange & { label: string }> => {
	const now = new Date();
	now.setHours(23, 59, 59, 999);

	const firstDayOfWeek = new Date(now);
	const day = now.getDay() || 7;
	firstDayOfWeek.setDate(now.getDate() - day + 1);
	firstDayOfWeek.setHours(0, 0, 0, 0);

	const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
	firstDayOfYear.setHours(0, 0, 0, 0);

	return [
		{
			label: "Cette semaine",
			startDate: firstDayOfWeek,
			endDate: now,
		},
		{
			label: "7 derniers jours",
			startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
			endDate: now,
		},
		{
			label: "30 derniers jours",
			startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
			endDate: now,
		},
		{
			label: "3 derniers mois",
			startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
			endDate: now,
		},
		{
			label: "Cette année",
			startDate: firstDayOfYear,
			endDate: now,
		},
	];
};

export const cardVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
};

export const chartVariants = {
	hidden: { opacity: 0, scale: 0.8 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: {
			type: "spring",
			stiffness: 200,
			damping: 20,
		},
	},
};
