import { basename, extname, join, resolve } from 'node:path';
import { isPathInside } from './security';

export const REFERENCE_IMAGE_MAX_BYTES = 25 * 1024 * 1024;
export const REFERENCE_THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;
export const REFERENCE_THUMBNAIL_EDGE = 256;
export const REFERENCE_THUMBNAIL_DIRECTORY = 'reference-thumbnails';

const HANDLE_PATTERN = /^[A-Za-z0-9._:-]{1,512}$/;
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']);

export const isOpaqueReferenceHandle = (value: unknown): value is string => typeof value === 'string' && HANDLE_PATTERN.test(value);

export const referenceThumbnailPath = (root: string, handle: string): string | undefined => {
  if (!isOpaqueReferenceHandle(handle)) return undefined;
  const directory = resolve(root, REFERENCE_THUMBNAIL_DIRECTORY);
  const candidate = resolve(directory, `${handle}.png`);
  return isPathInside(directory, candidate) ? candidate : undefined;
};

export const hasSupportedReferenceExtension = (filePath: string): boolean => EXTENSIONS.has(extname(filePath).toLowerCase());

export const suggestedReferenceLabel = (filePath: string): string => {
  const rawBase = basename(filePath);
  const value = /^\.[^./]+$/.test(rawBase) ? '' : basename(filePath, extname(filePath)).replace(/^\.+/, '').trim().replace(/\s+/g, ' ');
  return (value || 'Reference image').slice(0, 200);
};

export const pngDataUrl = (bytes: Uint8Array): string => `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;

export const thumbnailDirectory = (root: string): string => join(root, REFERENCE_THUMBNAIL_DIRECTORY);
