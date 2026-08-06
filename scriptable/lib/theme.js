// ponytail: Color.dynamic(light,dark) because Device.isUsingDarkAppearance() does not work in widgets
const PALETTE = {
	text: { light: "#1c1c1e", dark: "#f2f2f7" },
	secondaryText: { light: "#6b7280", dark: "#98989f" },
	muted: { light: "#9ca3af", dark: "#6b7280" },
	primary: { light: "#f97316", dark: "#fb923c" },
	accent: { light: "#2563eb", dark: "#60a5fa" },
	success: { light: "#16a34a", dark: "#4ade80" },
	warning: { light: "#d97706", dark: "#fbbf24" },
	danger: { light: "#dc2626", dark: "#f87171" },
	card: { light: "#ffffff", dark: "#1c1c1e" },
	border: { light: "#00000014", dark: "#ffffff14" },
};

function t(key) {
	const pair = PALETTE[key];
	if (!pair)
		throw new Error(`theme.t: unknown color key "${key}"`);
	return Color.dynamic(
		new Color(pair.light),
		new Color(pair.dark),
	);
}

function background() {
	return Color.clear();
}

function solidBackground(topHex, bottomHex) {
	const g = new LinearGradient();
	g.colors = [new Color(topHex), new Color(bottomHex)];
	g.locations = [0, 1];
	return g;
}

module.exports = {
	PALETTE,
	t,
	background,
	solidBackground,
};
