import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const MAX_HEX_COLOR = 0xffffff;

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function randomHexColor(): `#${string}` {
  const color = Math.floor(Math.random() * MAX_HEX_COLOR)
    .toString(16)
    .padStart(6, '0');
  return `#${color}`;
}
