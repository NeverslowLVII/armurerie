export const formatCurrency = (value: number): string => {
	const dollars = value / 100;
	return new Intl.NumberFormat("us-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		currencyDisplay: "code",
	}).format(dollars);
};

export const formatDate = (date: Date): string => {
	return date.toLocaleDateString("us-US", {
		year: "numeric",
		month: "numeric",
		day: "numeric",
	});
};

export const formatPercentage = (value: number): string => {
	return new Intl.NumberFormat("us-US", {
		style: "percent",
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	}).format(value);
};
