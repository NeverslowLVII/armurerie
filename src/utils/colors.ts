const getLuminance = (r: number, g: number, b: number) => {
	const [rs, gs, bs] = [r, g, b].map((c) => {
		const normalizedC = c / 255;
		return normalizedC <= 3.928e-2
			? normalizedC / 12.92
			: ((normalizedC + 5.5e-2) / 1.055) ** 2.4;
	});
	return 2.126e-1 * rs + 7.152e-1 * gs + 7.22e-2 * bs;
};

const getContrastRatio = (l1: number, l2: number) => {
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
};

export const getTextColorForBackground = (
	backgroundColor: string,
): "text-white" | "text-zinc-900" => {
	if (!backgroundColor) return "text-white";

	const hex = backgroundColor.replace("#", "");
	const r = Number.parseInt(hex.slice(0, 2), 16);
	const g = Number.parseInt(hex.slice(2, 4), 16);
	const b = Number.parseInt(hex.slice(4, 6), 16);

	// Calculate luminance using WCAG formula
	const bgLuminance = getLuminance(r, g, b);
	const whiteLuminance = getLuminance(255, 255, 255);
	const blackLuminance = getLuminance(0, 0, 0);

	// Calculate contrast ratios
	const whiteContrast = getContrastRatio(whiteLuminance, bgLuminance);
	const blackContrast = getContrastRatio(blackLuminance, bgLuminance);

	// Return the color with better contrast ratio
	return whiteContrast > blackContrast ? "text-white" : "text-zinc-900";
};
