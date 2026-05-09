import type { CloudinaryTransform } from '@/types/upload.types';

const DEFAULT_CLOUDINARY_CLOUD = 'demo';

export function buildCloudinaryUrl(publicId: string, cloudName: string, transform: CloudinaryTransform = {}): string {
  const clauses = [
    transform.width ? `w_${transform.width}` : undefined,
    transform.height ? `h_${transform.height}` : undefined,
    transform.crop ? `c_${transform.crop}` : undefined,
    transform.quality ? `q_${transform.quality}` : 'q_auto',
    transform.format ? `f_${transform.format}` : 'f_auto',
  ].filter(Boolean);

  const transforms = clauses.length > 0 ? `${clauses.join(',')}/` : '';
  const resolvedCloud = cloudName || DEFAULT_CLOUDINARY_CLOUD;

  return `https://res.cloudinary.com/${resolvedCloud}/image/upload/${transforms}${publicId}`;
}
