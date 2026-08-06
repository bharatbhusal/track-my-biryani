const config = importModule("config")

module.exports = { family, isAccessory, mode, scale, font }

function family() {
	return config.widgetFamily
}

function isAccessory() {
	return config.runsInAccessoryWidget
}

function mode() {
	const f = config.widgetFamily
	if (f === "small" || config.runsInAccessoryWidget) return "compact"
	if (f === "medium") return "standard"
	if (f === "large" || f === "extraLarge") return "expanded"
	return "standard"
}

function scale(pts) {
	const f = config.widgetFamily
	if (f === "large" || f === "extraLarge") return pts * 1.15
	return pts
}

function font(weight, pts) {
	const size = scale(pts)
	switch (weight) {
		case "bold": return Font.boldSystemFont(size)
		case "semibold": return Font.semiboldSystemFont(size)
		case "medium": return Font.mediumSystemFont(size)
		case "mono": return Font.mediumMonospacedSystemFont(size)
		default: return Font.systemFont(size)
	}
}
