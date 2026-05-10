export function parseCustomBound(
	value: string,
	bound: "from" | "to",
): Date {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return new Date();
	}

	if (!value.includes("T")) {
		if (bound === "from") {
			parsed.setHours(0, 0, 0, 0);
		} else {
			parsed.setHours(23, 59, 59, 999);
		}
	}

	return parsed;
}
