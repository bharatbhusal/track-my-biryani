function toSnakeCase(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.replace(/_+/g, "_");
}

type FilenameOptions = {
	baseName: string;
	extension: string;
	timestamp?: number;
};

export function buildTimestampedFilename({
	baseName,
	extension,
	timestamp = Math.floor(Date.now() / 1000),
}: FilenameOptions): string {
	const normalizedBase = toSnakeCase(baseName) || "file";
	const normalizedExtension = extension
		.replace(/^\./, "")
		.toLowerCase();
	return `${normalizedBase}_${timestamp}.${normalizedExtension}`;
}

export function buildUploadPublicId(
	expenseName: string,
	timestamp = Math.floor(Date.now() / 1000),
): string {
	const normalized = toSnakeCase(expenseName) || "expense";
	return `${normalized}_expense_${timestamp}`;
}
