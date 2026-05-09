function toSnakeCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export function buildExportFilename(name: string, extension: string): string {
  const normalizedName = toSnakeCase(name) || 'export';
  const normalizedExt = extension.replace(/^\./, '').toLowerCase();
  return `${normalizedName}_${getUnixTimestamp()}.${normalizedExt}`;
}

export function buildUploadFilename(name: string, extension: string): string {
  const normalizedName = toSnakeCase(name) || 'expense';
  const normalizedExt = extension.replace(/^\./, '').toLowerCase();
  return `${normalizedName}_${getUnixTimestamp()}.${normalizedExt}`;
}
