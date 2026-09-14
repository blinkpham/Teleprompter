import { describe, expect, it } from 'vitest';
import {
  hasSupportedReferenceExtension,
  isOpaqueReferenceHandle,
  pngDataUrl,
  referenceThumbnailPath,
  suggestedReferenceLabel,
} from './reference-thumbnails';

describe('reference thumbnail boundary', () => {
  it('accepts only opaque handles and keeps them inside the private thumbnail directory', () => {
    expect(isOpaqueReferenceHandle('thumb-123')).toBe(true);
    expect(isOpaqueReferenceHandle('../outside')).toBe(false);
    expect(isOpaqueReferenceHandle('/tmp/image.png')).toBe(false);
    expect(referenceThumbnailPath('/profile', 'thumb-123')).toBe('/profile/reference-thumbnails/thumb-123.png');
    expect(referenceThumbnailPath('/profile', '../outside')).toBeUndefined();
  });

  it('allows raster chooser extensions and produces a bounded display label', () => {
    expect(hasSupportedReferenceExtension('/tmp/Black Bottle.JPG')).toBe(true);
    expect(hasSupportedReferenceExtension('/tmp/vector.svg')).toBe(false);
    expect(suggestedReferenceLabel('/tmp/Black   Bottle.JPG')).toBe('Black Bottle');
    expect(suggestedReferenceLabel('/tmp/.JPG')).toBe('Reference image');
  });

  it('wraps generated thumbnail bytes as a data URL without exposing a path', () => {
    expect(pngDataUrl(new Uint8Array([0, 1, 2]))).toBe('data:image/png;base64,AAEC');
  });
});
